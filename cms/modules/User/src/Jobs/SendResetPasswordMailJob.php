<?php

namespace Modules\User\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Modules\User\Mail\ResetPasswordMail;

class SendResetPasswordMailJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(
        public string $userName,
        public string $toEmail,
        public string $resetUrl,
        public int $ttlMinutes = 60
    ) {}

    /**
     * @return int[]
     */
    public function backoff(): array
    {
        return [10, 20, 60];
    }

    public function handle(): void
    {
        Mail::to($this->toEmail)->send(new ResetPasswordMail($this->userName, $this->resetUrl, $this->ttlMinutes));
    }
}
