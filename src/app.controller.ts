import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import * as Express from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'hello';
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  // @ts-ignore
  async uploadPDF(@UploadedFile() file: Express.Multer.File) {
    return this.appService.convertPdfToSlides(file);
  }
}
