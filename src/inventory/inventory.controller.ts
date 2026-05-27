import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, AdjustStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── CREATE ──────────────────────────────────────────────────────────────
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Create a new inventory item' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  // ── READ ALL ─────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all active inventory items' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'lowStockOnly', required: false, type: String })
  findAll(@Query('category') category?: string, @Query('lowStockOnly') lowStockOnly?: string) {
    return this.inventoryService.findAll(category, lowStockOnly);
  }

  // ── READ ONE ─────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single inventory item by ID' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────
  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Update an inventory item' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Soft-delete an inventory item' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  // ── STOCK ADJUST ─────────────────────────────────────────────────────────
  @Patch(':id/stock')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Adjust stock level (positive = add, negative = deduct)' })
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(id, dto);
  }

  // ── AVAILABILITY ──────────────────────────────────────────────────────────
  @Get(':id/availability')
  @ApiOperation({ summary: 'Check real-time availability of an item' })
  availability(@Param('id') id: string) {
    return this.inventoryService.getAvailability(id);
  }
}
