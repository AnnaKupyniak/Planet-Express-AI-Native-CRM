-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'crew',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_evil" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "danger_level" TEXT NOT NULL DEFAULT 'low',

    CONSTRAINT "Planet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" SERIAL NOT NULL,
    "cargo_name" TEXT NOT NULL,
    "reward_cash" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "planet_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "role_on_ship" TEXT NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "crew_member_id" INTEGER NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightLog" (
    "id" SERIAL NOT NULL,
    "note" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_id" INTEGER NOT NULL,

    CONSTRAINT "FlightLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_delivery_id_crew_member_id_key" ON "Assignment"("delivery_id", "crew_member_id");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_planet_id_fkey" FOREIGN KEY ("planet_id") REFERENCES "Planet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "CrewMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLog" ADD CONSTRAINT "FlightLog_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
