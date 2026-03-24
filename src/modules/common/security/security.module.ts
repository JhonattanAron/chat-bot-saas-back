import { Module } from '@nestjs/common';
import { CryptoUtil } from './crypto.util';

@Module({
  providers: [CryptoUtil],
  exports: [CryptoUtil],
})
export class SecurityModule {}
