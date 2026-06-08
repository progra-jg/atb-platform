import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsers1710000000000 implements MigrationInterface {
  name = "CreateUsers1710000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.createTable(
      new Table({
        name: "farmer_profiles",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "name", type: "varchar", length: "100" },
          { name: "phone", type: "varchar", length: "20", isUnique: true },
          { name: "village", type: "varchar", isNullable: true },
          { name: "gps_coordinates", type: "jsonb", isNullable: true },
          { name: "languages", type: "text", isNullable: true },
          { name: "cooperative_id", type: "varchar", isNullable: true },
          { name: "password_hash", type: "varchar" },
          { name: "role", type: "varchar", default: "'farmer'" },
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "buyer_profiles",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "company", type: "varchar", length: "150" },
          { name: "email", type: "varchar", length: "100", isUnique: true },
          { name: "country", type: "varchar", length: "50" },
          { name: "accreditations", type: "text", isNullable: true },
          { name: "wallet_address", type: "varchar", isNullable: true },
          { name: "password_hash", type: "varchar" },
          { name: "role", type: "varchar", default: "'buyer'" },
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("buyer_profiles");
    await queryRunner.dropTable("farmer_profiles");
  }
}
