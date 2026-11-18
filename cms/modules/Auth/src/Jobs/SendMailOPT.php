<?php

namespace Modules\Auth\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Modules\Auth\Mail\OtpVerificationMail;

class SendMailOPT implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $userName,
        public string $otpCode,
        public string $toEmail,
        public int $ttlMinutes
    ) {
    }

    public function backoff(): array
    {
        return [10, 20, 60];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Mail::to($this->toEmail)->send(new OtpVerificationMail($this->userName, $this->otpCode, $this->ttlMinutes));
    }
}
