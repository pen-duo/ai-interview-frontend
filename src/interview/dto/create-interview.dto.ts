import { ApiProperty } from '@nestjs/swagger';

export class CreateInterviewDto {
  @ApiProperty({
    description: '面试标题',
    example: '前端一面',
  })
  title: string;

  @ApiProperty({
    description: '面试公司',
    example: '字节跳动',
  })
  company: string;

  @ApiProperty({
    description: '面试岗位',
    example: '前端开发工程师',
  })
  position: string;

  @ApiProperty({
    description: '面试内容或备注',
    example: '主要考察了 JavaScript、Vue 和项目经验',
  })
  content: string;
}
