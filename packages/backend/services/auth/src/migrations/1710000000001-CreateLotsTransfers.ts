import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateLotsTransfers1710000000001 implements MigrationInterface {
  name = "CreateLotsTransfers1710000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "lots",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "hash", type: "varchar", length: "64", isUnique: true },
          { name: "owner", type: "varchar" },
          { name: "culture", type: "varchar", length: "50" },
          { name: "quantite", type: "float" },
          { name: "status", type: "varchar", length: "20", default: "'created'" },
          { name: "parcelle_id", type: "varchar" },
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "transfers",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "lot_id", type: "uuid" },
          { name: "from", type: "varchar" },
          { name: "to", type: "varchar" },
          { name: "signature", type: "varchar" },
          { name: "location", type: "varchar", isNullable: true },
          { name: "timestamp", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "parcelles",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "owner_id", type: "uuid" },
          { name: "polygone", type: "geometry", spatialFeatureType: "Polygon", srid: 4326 },
          { name: "superficie", type: "float" },
          { name: "culture", type: "varchar", length: "50" },
          { name: "village", type: "varchar", isNullable: true },
          { name: "photos", type: "text", isNullable: true },
          { name: "is_verified", type: "boolean", default: false },
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("parcelles");
    await queryRunner.dropTable("transfers");
    await queryRunner.dropTable("lots");
  }
}
