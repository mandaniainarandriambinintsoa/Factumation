import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../auth/public.decorator.js';
import { ContactService } from './contact.service.js';
import { ContactAcceptedDto, ContactRequestDto } from './dto/contact.dto.js';

@ApiTags('contact')
@Controller({ path: 'contact', version: '1' })
export class ContactController {
  constructor(@Inject(ContactService) private readonly contact: ContactService) {}
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(202)
  @ApiAcceptedResponse({ type: ContactAcceptedDto })
  async send(@Body() input: ContactRequestDto): Promise<ContactAcceptedDto> {
    await this.contact.send(input);
    return { status: 'accepted' };
  }
}
