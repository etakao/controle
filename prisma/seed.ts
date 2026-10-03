import { PrismaClient, CategoryType, PaymentMethod, SplitStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addMonths, startOfMonth, subMonths } from "date-fns";

const prisma = new PrismaClient();

const incomeCategories = [
  ["Salário", "#B8F0D4"],
  ["Freelance", "#C2E4FF"],
  ["Investimentos", "#D4C5F9"],
  ["Outros", "#FFF0A0"]
] as const;

const expenseCategories = [
  ["Contas", "#C2E4FF"],
  ["Lazer", "#FFD6C0"],
  ["Alimentação", "#FFCCE0"],
  ["Transporte", "#FFF0A0"],
  ["Saúde", "#B8F0D4"],
  ["Outros", "#D4C5F9"]
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("senha123", 12);

  const user = await prisma.user.upsert({
    where: { email: "teste@controle.app" },
    update: { name: "Usuário Teste", passwordHash },
    create: {
      name: "Usuário Teste",
      email: "teste@controle.app",
      passwordHash,
      emailVerified: true
    }
  });

  const partner = await prisma.user.upsert({
    where: { email: "parceiro@controle.app" },
    update: {},
    create: {
      name: "Pessoa Parceira",
      email: "parceiro@controle.app",
      passwordHash: await bcrypt.hash("senha123", 12),
      emailVerified: true
    }
  });

  const group = await prisma.group.create({
    data: {
      name: "Finanças da Casa",
      description: "Grupo de demonstração do Controlê",
      members: {
        create: [
          { userId: user.id, role: "OWNER" },
          { userId: partner.id, role: "MEMBER" }
        ]
      }
    }
  });

  await prisma.category.createMany({
    data: [
      ...incomeCategories.map(([name, color]) => ({
        groupId: group.id,
        name,
        color,
        type: CategoryType.INCOME,
        isDefault: true
      })),
      ...expenseCategories.map(([name, color]) => ({
        groupId: group.id,
        name,
        color,
        type: CategoryType.EXPENSE,
        isDefault: true
      }))
    ],
    skipDuplicates: true
  });

  const categories = await prisma.category.findMany({ where: { groupId: group.id } });
  const byName = new Map(categories.map((category) => [category.name, category]));
  const base = startOfMonth(new Date());

  for (let offset = 0; offset < 3; offset += 1) {
    const month = subMonths(base, offset);

    await prisma.income.create({
      data: {
        groupId: group.id,
        responsibleId: user.id,
        categoryId: byName.get("Salário")?.id,
        amount: 7200,
        date: month,
        description: `Salário de ${month.toLocaleDateString("pt-BR", { month: "long" })}`
      }
    });

    const rent = await prisma.expense.create({
      data: {
        groupId: group.id,
        responsibleId: user.id,
        categoryId: byName.get("Contas")?.id,
        amount: 2600,
        date: addMonths(month, 0),
        description: "Aluguel e condomínio",
        paymentMethod: PaymentMethod.PIX,
        installments: 1,
        installmentNum: 1
      }
    });

    await prisma.expenseSplit.createMany({
      data: [
        {
          expenseId: rent.id,
          userId: user.id,
          amount: 1300,
          status: SplitStatus.PAID,
          paidAt: new Date()
        },
        {
          expenseId: rent.id,
          userId: partner.id,
          amount: 1300,
          status: offset === 0 ? SplitStatus.PENDING : SplitStatus.PAID,
          paidAt: offset === 0 ? null : new Date()
        }
      ]
    });

    await prisma.expense.create({
      data: {
        groupId: group.id,
        responsibleId: partner.id,
        categoryId: byName.get("Alimentação")?.id,
        amount: 860 + offset * 45,
        date: addMonths(month, 0),
        description: "Mercado do mês",
        paymentMethod: PaymentMethod.CREDIT_CARD,
        installments: 1,
        installmentNum: 1
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
