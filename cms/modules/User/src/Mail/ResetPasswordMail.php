<?php

namespace Modules\User\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $resetUrl,
        public int $ttlMinutes = 60
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your DOOH Media Account Password',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'user::emails.reset_password',
            with: [
                'userName' => $this->userName,
                'resetUrl' => $this->resetUrl,
                'ttlMinutes' => $this->ttlMinutes,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
