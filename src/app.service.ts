import { Injectable, BadRequestException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    console.log(this.configService.get<string>('OPENAI_API_KEY'));
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } catch (error) {
      throw new BadRequestException('Не удалось обработать PDF файл');
    }
  }

  async generateSlidesFromText(text: string): Promise<string> {
    // return DEFAULT_RESP;
    try {
      const prompt = `
        Пожалуйста, возьми текст ${text} и создай структуру презентации.
        Раздели текст на основные пункты для каждого слайда и соответствующие подпункты.
        Верни результат в формате JSON, где каждый элемент массива — объект, содержащий
        title как заголовок слайда и content как массив строк, представляющих основные
        пункты содержания слайда. В поле content должен быть только массив строк`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      try {
        const cleanedResponse = completion.choices[0].message.content
          .replace(/```json|```/g, '')
          .trim();
        const jsonArray = JSON.parse(cleanedResponse);
        return jsonArray;
      } catch (error) {
        throw new BadRequestException(
          'Ошибка при разборе JSON или удалении markdown:',
          error,
        );
      }
    } catch (error) {
      throw new BadRequestException(
        'Не удалось сгенерировать контент для слайдов',
      );
    }
  }
  // @ts-ignore
  async convertPdfToSlides(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Необходимо загрузить файл PDF');
    }

    // Шаг 1: Извлечение текста из PDF
    const text = await this.extractTextFromPDF(file.buffer);

    // Шаг 2: Генерация контента для слайдов с помощью OpenAI
    const result = await this.generateSlidesFromText(text);

    return { result }; // Возвращаем структуру для слайдов
  }
}
