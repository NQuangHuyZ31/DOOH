<?php

namespace Modules\Core\Tests\Unit\Support;

use Illuminate\Database\QueryException;
use Modules\Core\Support\CodeGenerator;
use PHPUnit\Framework\TestCase;

class CodeGeneratorTest extends TestCase
{
	public function test_build_slug_base_truncates_and_trims_trailing_hyphen(): void
	{
		$longName = 'Trung Tam Thuong Mai Vincom Mega Mall Grand Park Quan 9 Thanh Pho Thu Duc';
		$base = CodeGenerator::buildSlugBase('SGN', $longName, 48);

		$this->assertLessThanOrEqual(48, strlen($base));
		$this->assertStringStartsWith('SGN-', $base);
		$this->assertFalse(str_ends_with($base, '-'));
	}

	public function test_next_unique_code_unnumbered_returns_base_or_increments_from_max(): void
	{
		$this->assertSame('SGN-LM81', CodeGenerator::nextUniqueCode('SGN-LM81', [], false, 0, 52));
		$this->assertSame('SGN-LM81-2', CodeGenerator::nextUniqueCode('SGN-LM81', ['SGN-LM81'], false, 0, 52));
		$this->assertSame('SGN-LM81-6', CodeGenerator::nextUniqueCode('SGN-LM81', ['SGN-LM81', 'SGN-LM81-2', 'SGN-LM81-5'], false, 0, 52));
	}

	public function test_next_unique_code_always_numbered_uses_padding_and_respects_max_length(): void
	{
		$this->assertSame('SCR-SGN-LM81-01', CodeGenerator::nextUniqueCode('SCR-SGN-LM81', [], true, 2, 64));
		$this->assertSame('SCR-SGN-LM81-10', CodeGenerator::nextUniqueCode('SCR-SGN-LM81', ['SCR-SGN-LM81-01', 'SCR-SGN-LM81-09'], true, 2, 64));

		$longPrefix = 'SCR-' . str_repeat('A', 62);
		$code = CodeGenerator::nextUniqueCode($longPrefix, [], true, 2, 64);
		$this->assertLessThanOrEqual(64, strlen($code));
		$this->assertStringEndsWith('-01', $code);
	}

	public function test_create_with_retry_retries_on_duplicate_key_error(): void
	{
		$attempts = 0;
		$result = CodeGenerator::createWithRetry(function () use (&$attempts) {
			$attempts++;
			if ($attempts < 2) {
				$prev = new \PDOException('Duplicate entry', 23000);
				throw new QueryException('mysql', 'insert into screens', [], $prev);
			}

			return 'OK';
		}, 3);

		$this->assertSame('OK', $result);
		$this->assertSame(2, $attempts);
	}
}
