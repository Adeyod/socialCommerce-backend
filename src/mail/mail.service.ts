import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { ShipmentItem } from '../modules/orders/types/order.types';
import { SendEmailJob } from './interface/mail.interface';

@Injectable()
export class MailService {
  constructor(@InjectQueue('mail') private mailQueue: Queue<SendEmailJob>) {}
  private app_name = 'Go Shopping App';

  private async sendMail(data: SendEmailJob) {
    console.log('🚀 Adding email job...', data);

    await this.mailQueue.add('send_email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log('✅ Job added');

    return { message: `Email job added to queue for ${data.to}` };
  }

  async sendVerificationEmail(to: string, first_name: string, token: string) {
    return await this.sendMail({
      to,
      subject: 'Verify your email',
      templateName: 'verify-email.ejs',
      templateData: { first_name, token, app_name: this.app_name },
    });
  }

  async sendPasswordReset(to: string, first_name: string, token: string) {
    return this.sendMail({
      to,
      subject: 'Password Reset',
      templateName: 'password-reset.ejs',
      templateData: { first_name, token, app_name: this.app_name },
    });
  }

  async sendVendorOrderPaid(
    to: string,
    title: string,
    orderId: string,
    businessName: string,
    items: ShipmentItem[],
  ) {
    return this.sendMail({
      to,
      subject: title,
      templateName: 'send-vendor-order-paid.ejs',
      templateData: { businessName, orderId, items, app_name: this.app_name },
    });
  }
  async sendRiderInviteMail(to: string, title: string, businessName: string) {
    return this.sendMail({
      to,
      subject: title,
      templateName: 'send-rider-invite-mail.ejs',
      templateData: { businessName, app_name: this.app_name },
    });
  }
}
