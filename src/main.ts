import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Image Upload Service')
    .setDescription('The image upload service API description')
    .setVersion('1.0')
    .addTag('uploads')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

   const PORT = process.env.PORT ?? 3000;


  await app.listen(PORT||3000);
 console.log(`🚀 Image Upload Service running on http://localhost:${PORT}`);


}
bootstrap();
