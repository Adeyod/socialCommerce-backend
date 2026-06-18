import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { CollectionService } from './collection.service';
import { CreateCollectionFeeDto } from './dtos/create-collection-fee.dto';
import { UpdateCollectionFeeDto } from './dtos/update-collection-fee.dto';
import { NigeriaState } from './schemas/collection-fee.schema';

@Controller('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('create-collection-fee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Collection fee created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create state collection fee.',
    description:
      'This is the collection fee that will be added for main pickup center to collect inter state products.',
  })
  @ApiResponse({
    status: 201,
    description: 'Collection created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create collection fee',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createCollectionFee(
    @Body() createCollectionFeeDto: CreateCollectionFeeDto,
  ) {
    const response = await this.collectionService.createCollectionFee(
      createCollectionFeeDto,
    );

    return response;
  }

  @Patch('update-collection-fee/:collectionFeeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Collection fee updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update state collection fee.',
    description:
      'This is the endpoint to update collection fee. Can be used to change the base fee or the additional fee.',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update collection fee',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateCollectionFee(
    @Param('collectionFeeId') collectionFeeId: string,
    @Body() updateCollectionFeeDto: UpdateCollectionFeeDto,
  ) {
    const response = await this.collectionService.updateCollectionFee(
      collectionFeeId,
      updateCollectionFeeDto,
    );

    return response;
  }

  @Patch('delete-collection-fee/:collectionFeeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Collection fee deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete state collection fee.',
    description: 'This is the endpoint to delete collection fee.',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to delete collection fee',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteCollectionFee(@Param('collectionFeeId') collectionFeeId: string) {
    const response =
      await this.collectionService.deleteCollectionFee(collectionFeeId);

    return response;
  }

  @Get('find-collection-fee/:collectionFeeId')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.admin, Role.user)
  // @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Collection fee fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch state collection fee.',
    description: 'This is the endpoint for fetching collection fee.',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection fee fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch collection fee',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findCollectionFeeByCollectionFeeId(
    @Param('collectionFeeId') collectionFeeId: string,
  ) {
    const response =
      await this.collectionService.findCollectionFeeByCollectionFeeId(
        collectionFeeId,
      );

    return response;
  }

  @Get('find-collection-fee-by-state/:state')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.admin)
  // @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Collection fee fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch state collection fee.',
    description:
      'This is the endpoint for fetching collection fee using state as parameter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch collection fee',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findCollectionFeeByState(@Param('state') state: NigeriaState) {
    const response =
      await this.collectionService.findCollectionFeeByState(state);

    return response;
  }
}
