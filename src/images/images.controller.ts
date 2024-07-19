import { Controller, Get, Param, NotFoundException, Res } from '@nestjs/common';
import { ImagesService } from './images.service';
import { Response } from 'express';

@Controller()
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get('/api/images/:id')
  async getImage(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const fileStream = await this.imagesService.getImageById(id);

      fileStream.on('error', (error) => {
        res.status(404).send('Image not found');
      });

      res.setHeader('Content-Type', 'image/jpeg');
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException(`Image with id ${id} not found`);
    }
  }
}
