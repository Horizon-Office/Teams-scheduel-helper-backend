import { 
    Controller,
    Get,
    HttpCode, 
    UseGuards,
 } from '@nestjs/common';
import { AuthGuard } from 'src/secure/auth/auth.guard';

@Controller('order')
export class OrderController {
    
    @UseGuards(AuthGuard)
    @Get()
    @HttpCode(200)
    getOrders() {
        return { message: 'Orders retrieved successfully' };
    }    
}
