import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { ProxyAuthGuard } from "src/modules/auth/proxy-auth.guard";

@Controller("cart")
@UseGuards(ProxyAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post()
  addToCart(@Req() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Delete(":itemId")
  removeFromCart(@Req() req, @Param("itemId") itemId: string) {
    return this.cartService.removeFromCart(req.user.id, itemId);
  }

  @Delete()
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
