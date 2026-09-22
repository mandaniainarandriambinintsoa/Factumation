import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import type { ClientInsert, ClientRow, ClientUpdate } from '../common/supabase/database.types.js';
import type { AuthPrincipal } from '../auth/auth-principal.js';
import { ClientsRepository } from './clients.repository.js';
import type {
  ClientListQueryDto,
  ClientListResponseDto,
  ClientResponseDto,
  CreateClientDto,
  UpdateClientDto,
} from './dto/client.dto.js';

@Injectable()
export class ClientsService {
  constructor(@Inject(ClientsRepository) private readonly repository: ClientsRepository) {}

  async list(
    principal: AuthPrincipal,
    accessToken: string,
    query: ClientListQueryDto,
  ): Promise<ClientListResponseDto> {
    try {
      const result = await this.repository.list({
        accessToken,
        ownerId: principal.id,
        page: query.page,
        limit: query.limit,
        ...(query.search ? { search: query.search } : {}),
      });
      return {
        items: result.rows.map((row) => this.toResponse(row)),
        page: query.page,
        limit: query.limit,
        total: result.total,
      };
    } catch {
      throw new InternalServerErrorException('Unable to load clients.');
    }
  }

  async findOne(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<ClientResponseDto> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Client not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Unable to load the client.');
    }
  }

  async create(
    principal: AuthPrincipal,
    accessToken: string,
    input: CreateClientDto,
  ): Promise<ClientResponseDto> {
    try {
      const row = await this.repository.create(accessToken, {
        ...this.toInsert(input),
        user_id: principal.id,
      });
      return this.toResponse(row);
    } catch {
      throw new InternalServerErrorException('Unable to create the client.');
    }
  }

  async update(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
    input: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one field is required.');
    }
    try {
      const row = await this.repository.update(accessToken, principal.id, id, this.toUpdate(input));
      if (!row) throw new NotFoundException('Client not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Unable to update the client.');
    }
  }

  async delete(principal: AuthPrincipal, accessToken: string, id: string): Promise<void> {
    try {
      if (!(await this.repository.delete(accessToken, principal.id, id))) {
        throw new NotFoundException('Client not found.');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Unable to delete the client.');
    }
  }

  private toInsert(input: CreateClientDto): Omit<ClientInsert, 'user_id'> {
    return {
      name: input.name,
      email: input.email.toLowerCase(),
      address: input.address ?? null,
      phone: input.phone ?? null,
      company_name: input.companyName ?? null,
      fiscal_region: input.fiscalRegion ?? 'NONE',
      siret: input.siret ?? null,
      vat_number: input.vatNumber?.toUpperCase() ?? null,
      nif: input.nif ?? null,
      stat: input.stat ?? null,
      notes: input.notes ?? null,
    };
  }

  private toUpdate(input: UpdateClientDto): ClientUpdate {
    return {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.companyName !== undefined ? { company_name: input.companyName } : {}),
      ...(input.fiscalRegion !== undefined ? { fiscal_region: input.fiscalRegion } : {}),
      ...(input.siret !== undefined ? { siret: input.siret } : {}),
      ...(input.vatNumber !== undefined
        ? { vat_number: input.vatNumber?.toUpperCase() ?? null }
        : {}),
      ...(input.nif !== undefined ? { nif: input.nif } : {}),
      ...(input.stat !== undefined ? { stat: input.stat } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
  }

  private toResponse(row: ClientRow): ClientResponseDto {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      address: row.address,
      phone: row.phone,
      companyName: row.company_name,
      fiscalRegion: row.fiscal_region ?? 'NONE',
      siret: row.siret,
      vatNumber: row.vat_number,
      nif: row.nif,
      stat: row.stat,
      notes: row.notes,
      createdAt: this.requiredTimestamp(row.created_at, 'created_at'),
      updatedAt: this.requiredTimestamp(row.updated_at ?? row.created_at, 'updated_at'),
    };
  }

  private requiredTimestamp(value: string | null, field: string): string {
    if (!value) throw new Error(`Client boundary is missing ${field}.`);
    return value;
  }
}
