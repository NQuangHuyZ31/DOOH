<?php

namespace Modules\Vendor\Listeners;

use Modules\User\Events\UserDeleted;
use Modules\User\Events\UserSaved;
use Modules\Vendor\Repositories\Interfaces\VendorRepositoryInterface;

class SyncVendorUserListener
{
	public function __construct(protected VendorRepositoryInterface $vendorRepo) {}

	public function handleSaved(UserSaved $event): void
	{
		if ($event->isNew) {
			if (!empty($event->data['vendor_id'])) {
				$this->vendorRepo->linkUser((int) $event->data['vendor_id'], $event->user->id);
			}

			return;
		}

		if (array_key_exists('vendor_id', $event->data)) {
			if (!empty($event->data['vendor_id'])) {
				$this->vendorRepo->linkUser((int) $event->data['vendor_id'], $event->user->id);
			} else {
				$this->vendorRepo->unlinkUser($event->user->id);
			}
		}

		if (isset($event->data['name'])) {
			$this->vendorRepo->syncContactName($event->user->id, (string) $event->data['name']);
		}
	}

	public function handleDeleted(UserDeleted $event): void
	{
		$this->vendorRepo->unlinkUser($event->userId);
	}
}
