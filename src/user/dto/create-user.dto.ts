import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'zhangsan',
  })
  username: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'zhangsan@example.com',
  })
  email: string;

  @ApiProperty({
    description: '登录密码',
    example: '123456',
  })
  password: string;
}
