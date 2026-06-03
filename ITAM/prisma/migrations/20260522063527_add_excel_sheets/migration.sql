-- CreateTable
CREATE TABLE "LaptopRecord" (
    "id" TEXT NOT NULL,
    "saq" TEXT,
    "employeeName" TEXT,
    "department" TEXT,
    "status" TEXT,
    "date" TEXT,
    "serialNumber" TEXT,
    "laptop" TEXT,
    "model" TEXT,
    "cpu" TEXT,
    "ram" TEXT,
    "hdd" TEXT,
    "lcd" TEXT,
    "keyboard" TEXT,
    "mouse" TEXT,
    "laptopBag" TEXT,
    "headPhones" TEXT,
    "mousepad" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaptopRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerDevice" (
    "id" TEXT NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "cpus" TEXT,
    "processor" TEXT,
    "ram" TEXT,
    "storage" TEXT,
    "ip" TEXT,
    "osVersion" TEXT,
    "status" TEXT,
    "noOfExistingVms" TEXT,
    "iloIps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IloIdrac" (
    "id" TEXT NOT NULL,
    "servers" TEXT,
    "ip" TEXT,
    "iloIdracIp" TEXT,
    "switchPort" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IloIdrac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudVm" (
    "id" TEXT NOT NULL,
    "no" TEXT,
    "cloudVmUsageDescription" TEXT,
    "ipAddress" TEXT,
    "ownerUserTeam" TEXT,
    "fqdn" TEXT,
    "cloud" TEXT,
    "specifications" TEXT,
    "userDepartment" TEXT,
    "sslStatus" TEXT,
    "sslExpiry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudVm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabVm" (
    "id" TEXT NOT NULL,
    "col1" TEXT,
    "department" TEXT,
    "vmName" TEXT,
    "hostServer" TEXT,
    "memorySize" TEXT,
    "ipAddress" TEXT,
    "dnsName" TEXT,
    "col8" TEXT,
    "sslStatus" TEXT,
    "sslExpiry" TEXT,
    "publicIpMiddlewareProxy" TEXT,
    "userTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabVm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicFqdn" (
    "id" TEXT NOT NULL,
    "formEtlExpertflowCom" TEXT,
    "publicIpMiddleware" TEXT,
    "pointsTo" TEXT,
    "usageUser" TEXT,
    "col5" TEXT,
    "mttHostDo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicFqdn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatePass" (
    "id" TEXT NOT NULL,
    "gpId" TEXT,
    "particulars" TEXT,
    "serialNumber" TEXT,
    "quantity" TEXT,
    "issuedBy" TEXT,
    "recievedTo" TEXT,
    "timeOut" TEXT,
    "timeIn" TEXT,
    "remarks" TEXT,
    "charger" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivedItem" (
    "id" TEXT NOT NULL,
    "col1" TEXT,
    "col2" TEXT,
    "receivedFrom" TEXT,
    "particulars" TEXT,
    "quantity" TEXT,
    "receivedBy" TEXT,
    "receivedDate" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceivedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortDetail" (
    "id" TEXT NOT NULL,
    "srNo" TEXT,
    "deviceName" TEXT,
    "col3" TEXT,
    "switch1Cisco2960" TEXT,
    "switch2Cisco3750" TEXT,
    "col6" TEXT,
    "srNo2" TEXT,
    "deviceName2" TEXT,
    "col9" TEXT,
    "switch1Cisco2960_2" TEXT,
    "switch2Cisco3750_2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeVm" (
    "id" TEXT NOT NULL,
    "vmName" TEXT,
    "serverIp" TEXT,
    "ram" TEXT,
    "vmIp" TEXT,
    "domainName" TEXT,
    "fqdn" TEXT,
    "deletedOn" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeVm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sheet38" (
    "id" TEXT NOT NULL,
    "hostName" TEXT,
    "ipAddress" TEXT,
    "customer" TEXT,
    "backupTypoe" TEXT,
    "backupPolicy" TEXT,
    "backupStore" TEXT,
    "itPolicy" TEXT,
    "responsiblePerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sheet38_pkey" PRIMARY KEY ("id")
);
