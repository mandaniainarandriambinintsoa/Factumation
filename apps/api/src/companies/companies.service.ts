import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type {
  CompanyInsert,
  CompanyRow,
  CompanyUpdate,
} from '../common/supabase/database.types.js';
import { CompaniesRepository } from './companies.repository.js';
import type {
  CompanyListQueryDto,
  CompanyListResponseDto,
  CompanyResponseDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './dto/company.dto.js';

@Injectable()
export class CompaniesService {
  constructor(@Inject(CompaniesRepository) private readonly repository: CompaniesRepository) {}

  async list(
    principal: AuthPrincipal,
    accessToken: string,
    query: CompanyListQueryDto,
  ): Promise<CompanyListResponseDto> {
    try {
      const result = await this.repository.list({
        accessToken,
        ownerId: principal.id,
        page: query.page,
        limit: query.limit,
        ...(query.search ? { search: query.search } : {}),
        ...(principal.allowedCompanyIds?.length
          ? { allowedCompanyIds: principal.allowedCompanyIds }
          : {}),
      });
      return {
        items: result.rows.map((row) => this.toResponse(row)),
        page: query.page,
        limit: query.limit,
        total: result.total,
      };
    } catch {
      throw new InternalServerErrorException('Unable to load companies.');
    }
  }

  async findOne(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<CompanyResponseDto> {
    if (principal.allowedCompanyIds?.length && !principal.allowedCompanyIds.includes(id))
      throw new NotFoundException('Company not found.');
    return this.findRequired(() => this.repository.findById(accessToken, principal.id, id));
  }

  async findDefault(
    principal: AuthPrincipal,
    accessToken: string,
  ): Promise<CompanyResponseDto | null> {
    try {
      const row = await this.repository.findDefault(accessToken, principal.id);
      if (
        row &&
        principal.allowedCompanyIds?.length &&
        !principal.allowedCompanyIds.includes(row.id)
      )
        return null;
      return row ? this.toResponse(row) : null;
    } catch {
      throw new InternalServerErrorException('Unable to load the default company.');
    }
  }

  async create(
    principal: AuthPrincipal,
    accessToken: string,
    input: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    try {
      return this.toResponse(
        await this.repository.create(accessToken, {
          ...this.toInsert(input),
          user_id: principal.id,
          is_default: false,
        }),
      );
    } catch {
      throw new InternalServerErrorException('Unable to create the company.');
    }
  }

  async update(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
    input: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one field is required.');
    }
    return this.findRequired(() =>
      this.repository.update(accessToken, principal.id, id, this.toUpdate(input)),
    );
  }

  async delete(principal: AuthPrincipal, accessToken: string, id: string): Promise<void> {
    try {
      if (!(await this.repository.delete(accessToken, principal.id, id))) {
        throw new NotFoundException('Company not found.');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Unable to delete the company.');
    }
  }

  async setDefault(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<CompanyResponseDto> {
    return this.findRequired(() => this.repository.setDefault(accessToken, principal.id, id));
  }

  private async findRequired(
    operation: () => Promise<CompanyRow | null>,
  ): Promise<CompanyResponseDto> {
    try {
      const row = await operation();
      if (!row) throw new NotFoundException('Company not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Unable to load or update the company.');
    }
  }

  private toInsert(input: CreateCompanyDto): Omit<CompanyInsert, 'user_id' | 'is_default'> {
    return {
      name: input.name,
      address: input.address ?? null,
      email: input.email?.toLowerCase() ?? null,
      phone: input.phone ?? null,
      logo_url: input.logoUrl ?? null,
      fiscal_region: input.fiscalRegion ?? 'NONE',
      siret: input.siret ?? null,
      vat_number: input.vatNumber?.toUpperCase() ?? null,
      nif: input.nif ?? null,
      stat: input.stat ?? null,
      iban: input.iban?.replace(/\s/g, '').toUpperCase() ?? null,
      bic: input.bic?.replace(/\s/g, '').toUpperCase() ?? null,
      default_currency: input.defaultCurrency?.toUpperCase() ?? 'EUR',
      default_payment_method: input.defaultPaymentMethod ?? 'Virement Bancaire',
      invoice_prefix: input.invoicePrefix?.toUpperCase() ?? 'INV',
      quote_prefix: input.quotePrefix?.toUpperCase() ?? 'DEV',
      notes: input.notes ?? null,
    };
  }

  private toUpdate(input: UpdateCompanyDto): CompanyUpdate {
    return {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.email !== undefined ? { email: input.email?.toLowerCase() ?? null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.logoUrl !== undefined ? { logo_url: input.logoUrl } : {}),
      ...(input.fiscalRegion !== undefined ? { fiscal_region: input.fiscalRegion } : {}),
      ...(input.siret !== undefined ? { siret: input.siret } : {}),
      ...(input.vatNumber !== undefined
        ? { vat_number: input.vatNumber?.toUpperCase() ?? null }
        : {}),
      ...(input.nif !== undefined ? { nif: input.nif } : {}),
      ...(input.stat !== undefined ? { stat: input.stat } : {}),
      ...(input.iban !== undefined
        ? { iban: input.iban?.replace(/\s/g, '').toUpperCase() ?? null }
        : {}),
      ...(input.bic !== undefined
        ? { bic: input.bic?.replace(/\s/g, '').toUpperCase() ?? null }
        : {}),
      ...(input.defaultCurrency !== undefined
        ? { default_currency: input.defaultCurrency.toUpperCase() }
        : {}),
      ...(input.defaultPaymentMethod !== undefined
        ? { default_payment_method: input.defaultPaymentMethod }
        : {}),
      ...(input.invoicePrefix !== undefined
        ? { invoice_prefix: input.invoicePrefix.toUpperCase() }
        : {}),
      ...(input.quotePrefix !== undefined ? { quote_prefix: input.quotePrefix.toUpperCase() } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
  }

  private toResponse(row: CompanyRow): CompanyResponseDto {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      email: row.email,
      phone: row.phone,
      logoUrl: row.logo_url,
      fiscalRegion: row.fiscal_region ?? 'NONE',
      siret: row.siret,
      vatNumber: row.vat_number,
      nif: row.nif,
      stat: row.stat,
      iban: row.iban,
      bic: row.bic,
      defaultCurrency: row.default_currency ?? 'EUR',
      defaultPaymentMethod: row.default_payment_method ?? 'Virement Bancaire',
      invoicePrefix: row.invoice_prefix ?? 'INV',
      quotePrefix: row.quote_prefix ?? 'DEV',
      isDefault: row.is_default ?? false,
      notes: row.notes,
      createdAt: this.requiredTimestamp(row.created_at, 'created_at'),
      updatedAt: this.requiredTimestamp(row.updated_at ?? row.created_at, 'updated_at'),
    };
  }

  private requiredTimestamp(value: string | null, field: string): string {
    if (!value) throw new Error(`Company boundary is missing ${field}.`);
    return value;
  }
}
