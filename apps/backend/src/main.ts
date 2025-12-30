import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupBullBoard } from './shared/queues/bull-board.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Setup Bull Board for queue monitoring (development only)
  setupBullBoard(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
