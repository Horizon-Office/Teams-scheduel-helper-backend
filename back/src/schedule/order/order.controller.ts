import { 
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    HttpCode, 
    UseGuards,
    Query,
    Param,
    HttpStatus,
    BadRequestException,
    Body,
 } from '@nestjs/common';
import { AuthGuard } from 'src/secure/auth/auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto/create-order.dto';
import { PaginateOrderDto } from './dto/paginate-order.dto/paginate-order.dto';
import { error } from 'console';
import { PatchOrderDto } from './dto/patch-order.dto/patch-order.dto';
import { DeleteOrderDto } from './dto/delete-order.dto/delete-order.dto';
import { GetIdOrderDto } from './dto/id-order.dto/id-order.dto';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Get()
    async getByIdOrder( 
        @Query() query: GetIdOrderDto,
    ) {
        try { 
            return await this.orderService.GetByIdOrder(query);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Order by id failed: ${error.message}`,
                error: "Bad request"
            });
        }
    }

    @Get('paginate')
    async paginateOrder( 
        @Query() query: PaginateOrderDto,
    ) {
        try { 
            return await this.orderService.PaginateOrder(query);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Order pagination failed: ${error.message}`,
                error: "Bad request"
            });
        }
    }

    @Post() 
    async сreateOrder(@Body() orderDto: CreateOrderDto) {
        try {
            return await this.orderService.CreateOrder(orderDto);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Order creation failed: ${error.message}`,
                error: "Bad Request"
            });
        }
    }

    @Patch(':id') 
    async patchOrder(
        @Param('id') id: string,
        @Body() patchOrderDto: PatchOrderDto
    ) {
        try {
            return await this.orderService.PatchOrder(id, patchOrderDto);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Order update failed: ${error.message}`,
                error: "Bad Request"
            });
        }
    }

    @Delete(':id')
    async deleteSingleOrder(@Param('id') id: string) {
        try {
            return await this.orderService.DeleteOrder(id);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Order delete failed: ${error.message}`,
                error: "Bad Request"
            });
        }
    }

    @Delete('batch')
    async deleteMultipleOrders(@Body() deleteOrderDto: DeleteOrderDto) {
        try {
            return await this.orderService.DeleteMultipleOrders(deleteOrderDto);
        } catch (error) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Orders delete failed: ${error.message}`,
                error: "Bad Request"
            });
        }
    }

}
