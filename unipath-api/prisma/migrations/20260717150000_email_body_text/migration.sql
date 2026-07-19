-- Fix: htmlBody/textBody étaient VARCHAR(191), trop courts pour les emails
ALTER TABLE `EmailDelivery` MODIFY `htmlBody` TEXT NULL;
ALTER TABLE `EmailDelivery` MODIFY `textBody` TEXT NULL;
