# 登录、注册与用户认证阶段总结

## 这一阶段完成了什么

这一阶段主要完成了用户模块里的注册、登录，以及基于 JWT 的用户认证能力。

已经实现的能力包括：

- 用户注册接口
- 用户登录接口
- JWT token 生成
- JWT token 校验
- 受保护接口获取当前用户信息
- 自定义 `@Public()` 装饰器，用来标记公开接口
- Swagger 中对 Bearer Token 接口的标注

---

## 一、先完成用户注册和登录

### 1. 设计用户数据结构

在 `src/user/schemas/user.schema.ts` 中定义了用户的 `Schema`，里面包括：

- `username`
- `password`
- `email`
- `roles`
- `isActive`
- 以及后续业务可能会用到的用户信息字段

这里不仅定义了字段，还做了两件很关键的事：

1. 在 `pre('save')` 里对密码进行加密  
这样注册时传入的是明文密码，但保存到数据库时会自动变成加密后的密码。

2. 在 `UserSchema.methods` 上挂了 `comparePassword()`  
这样登录时可以直接调用实例方法校验密码，而不用每次都手动写 bcrypt 对比逻辑。

---

### 2. 定义注册和登录的 DTO

在 `src/user/dto` 下定义了：

- `register-user.dto.ts`
- `login-user.dto.ts`

DTO 的作用是限制接口入参，并配合 `class-validator` 做校验。

例如：

- 注册时要求 `username`、`password`、`email`
- 登录时要求 `email`、`password`

这样做的意义是把“数据库结构”和“接口入参”分开：

- `Schema` 决定数据库里存什么
- `DTO` 决定接口允许前端传什么

---

### 3. 在 Service 中实现业务逻辑

在 `src/user/user.service.ts` 里完成了核心业务逻辑。

#### 注册 `register()`

主要流程：

1. 从 DTO 中取出 `username` 和 `email`
2. 查询数据库，判断用户名或邮箱是否已存在
3. 如果已存在，抛出 `ConflictException`
4. 如果不存在，创建用户
5. 返回用户信息时排除 `password`

#### 登录 `login()`

主要流程：

1. 根据邮箱查询用户
2. 如果用户不存在，抛出 `UnauthorizedException`
3. 调用 `user.comparePassword(password)` 校验密码
4. 如果密码错误，同样抛出 `UnauthorizedException`
5. 使用 `JwtService.signAsync()` 生成 `accessToken`
6. 返回 `accessToken` 和当前用户信息

---

### 4. 在 Controller 中暴露 HTTP 接口

在 `src/user/user.controller.ts` 中定义了：

- `POST /user/register`
- `POST /user/login`

Controller 负责：

- 接收请求
- 接收 `@Body()` 参数
- 调用 `UserService`
- 把结果返回给前端

这里也进一步理解了：

- `Controller` 更像接口入口
- `Service` 更像具体业务实现

---

## 二、接入 JWT 认证

### 1. 注册 `JwtModule`

在 `src/app.module.ts` 中通过 `JwtModule.registerAsync()` 注册了 JWT 配置。

这里做了两件事：

- 从 `ConfigService` 中读取 `jwt.secret`
- 从 `ConfigService` 中读取 `jwt.expiresIn`

`JwtModule` 的作用是提供 `JwtService`，主要负责：

- 生成 token
- 校验 token

---

### 2. 创建 `JwtStrategy`

在 `src/auth/jwt.strategy.ts` 中实现了 JWT 策略。

它的作用不是“生成 token”，而是“校验请求里的 token”。

主要逻辑：

1. 从请求头 `Authorization: Bearer xxx` 中提取 token
2. 使用 `jwt.secret` 验签
3. token 合法后，执行 `validate(payload)`
4. `validate()` 的返回值会挂到 `req.user` 上

这里还理解了一个重要点：

- token 里的字段名可以和业务层字段名不同
- 例如 token 里放 `sub`
- 在 `validate()` 中再映射成业务层更容易理解的 `userId`

也就是说：

- `payload` 是 token 原始内容
- `req.user` 是认证通过后提供给业务层使用的用户信息

---

### 3. 创建 `JwtAuthGuard`

在 `src/auth/jwt-auth.guard.ts` 中创建了 `JwtAuthGuard`。

它继承自 `AuthGuard('jwt')`，作用是把 `JwtStrategy` 应用到具体接口上。

可以这样理解：

- `JwtModule`：负责生成 token
- `JwtStrategy`：负责校验 token
- `JwtAuthGuard`：负责决定哪些接口要启用 JWT 认证

后面在接口上使用：

```ts
@UseGuards(JwtAuthGuard)
```

就表示这个接口必须登录后才能访问。

---

### 4. 优化 Guard 的错误信息

在 `JwtAuthGuard` 中重写了 `handleRequest()`，让认证失败时返回更清晰的中文错误：

- 未提供 token
- token 已过期
- token 无效
- 认证失败

这样前端联调和自己排查问题时会更方便。

---

## 三、实现“获取当前登录用户信息”接口

在 `src/user/user.controller.ts` 和 `src/user/user.service.ts` 中实现了用户信息接口。

接口大致流程：

1. 在 controller 上使用 `@UseGuards(JwtAuthGuard)`
2. 请求先经过 guard
3. guard 调用 `JwtStrategy`
4. `JwtStrategy.validate()` 返回的对象被挂到 `req.user`
5. controller 从 `req.user.userId` 中拿到当前登录用户 id
6. 调用 `userService.getUserInfo(userId)` 查询数据库
7. 返回当前用户信息

这个过程帮助理解了：

- `req.user` 不是前端直接传来的
- 而是 JWT 认证通过后，由 `JwtStrategy.validate()` 返回并挂上去的

---

## 四、处理了类型问题

在 `user.controller.ts` 中，`req.user` 默认没有类型信息，所以出现了 TypeScript 和 ESLint 报错。

为了解决这个问题，定义了 `AuthenticatedRequest` 类型，用来明确声明：

- `req.user.userId`
- `req.user.email`
- `req.user.username`

这样 controller 在使用 `req.user` 时就有了更明确的类型提示。

---

## 五、实现自定义公开接口装饰器

为了让某些接口不需要登录认证，在 `src/auth/public.decorator.ts` 中实现了 `@Public()` 装饰器。

### 实现思路

#### 1. 使用 `SetMetadata` 打标记

```ts
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

这里本质是在 controller 或 method 上贴一个隐藏标签：

- `isPublic = true`

#### 2. 在 `JwtAuthGuard` 中使用 `Reflector` 读取标记

在 `canActivate()` 中通过：

```ts
this.reflector.getAllAndOverride(...)
```

去读取当前方法和当前 controller 上是否有 `isPublic` 标记。

如果读取到了：

- 直接 `return true`
- 跳过 JWT 认证

如果没读取到：

- 继续执行 `super.canActivate(context)`
- 进入正常 JWT 认证流程

### 对这套机制的理解

可以用一句话记住：

- `SetMetadata`：负责贴标签
- `Reflector`：负责读标签

这类写法很适合：

- 认证白名单
- 角色权限控制
- 自定义日志
- 跳过某些全局逻辑

---

## 六、补充 Swagger 鉴权标记

为了让 Swagger 正确展示“这个接口需要 Bearer Token”，做了两件事：

### 1. 在受保护接口上加 `@ApiBearerAuth()`

例如在用户信息接口上标记它需要认证。

### 2. 在 `src/main.ts` 的 Swagger 配置中加入 `.addBearerAuth()`

只有这两步配合起来，Swagger 页面里才会正确展示 Bearer Token 鉴权能力。

这一步也进一步理解了：

- `@ApiBearerAuth()` 只是标记接口需要认证
- `.addBearerAuth()` 才是告诉 Swagger：系统里存在这种认证方式

---

## 七、这一阶段串起来后的完整链路

### 注册链路

1. 前端调用 `POST /user/register`
2. `RegisterUserDto` 校验参数
3. `UserService.register()` 查重并创建用户
4. `UserSchema.pre('save')` 自动加密密码
5. 返回去掉密码后的用户信息

### 登录链路

1. 前端调用 `POST /user/login`
2. `LoginUserDto` 校验参数
3. `UserService.login()` 查询用户
4. `comparePassword()` 校验密码
5. `JwtService.signAsync()` 生成 token
6. 返回 `accessToken` 和用户信息

### 访问受保护接口链路

1. 前端带 `Bearer Token` 请求接口
2. `JwtAuthGuard` 先判断是否命中 `@Public()`
3. 如果不是公开接口，就进入 JWT 认证
4. `JwtStrategy` 提取并校验 token
5. `validate()` 返回用户信息，挂到 `req.user`
6. controller 从 `req.user` 里取出当前登录用户 id
7. service 根据用户 id 查询数据并返回

---

## 八、这一阶段最重要的理解

这一阶段最核心的不是“把代码写出来”，而是把下面这些职责区分清楚了：

- `Schema`：数据库里怎么存
- `DTO`：接口允许收什么参数
- `Service`：业务逻辑怎么处理
- `Controller`：接口怎么暴露
- `JwtModule`：负责生成 token
- `JwtStrategy`：负责校验 token
- `JwtAuthGuard`：负责把认证应用到具体接口
- `@Public()`：负责标记哪些接口跳过认证

---

## 九、后面可以继续做什么

下一阶段可以继续完善：

- 把 `JwtAuthGuard` 注册成全局守卫
- 给登录和注册接口补更完整的 Swagger 注释
- 增加 `@CurrentUser()` 装饰器，直接获取当前用户
- 增加角色权限控制，例如 `@Roles('admin')`
- 增加刷新 token 机制

---

## 十、一句话总结

这一阶段已经完成了从“用户注册登录”到“JWT 认证保护接口”的完整闭环，并且对 Nest 中 `Schema`、`DTO`、`Service`、`Controller`、`Guard`、`Strategy`、`Decorator` 之间的协作关系有了比较清晰的理解。