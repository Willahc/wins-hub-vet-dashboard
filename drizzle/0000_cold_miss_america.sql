CREATE TABLE `crm` (
	`cnpj` text PRIMARY KEY NOT NULL,
	`stage` text DEFAULT 'Novo' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`next_contact` text DEFAULT '' NOT NULL,
	`contacted` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
