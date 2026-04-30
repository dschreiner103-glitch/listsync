const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const listings = [
    { title:"Nike Air Force 1 '07 Weiß Gr. 43", description:"Kaum getragen, fast neuwertig. Mit Originalkarton.", price:65, buyPrice:45, condition:"Sehr gut", category:"Schuhe", platforms:JSON.stringify(["ebay","vinted"]), views:142, days:5 },
    { title:"iPhone 13 Pro 256GB Space Grau", description:"Akku 94%, keine Kratzer, mit USB-C Adapter.", price:520, buyPrice:380, condition:"Sehr gut", category:"Elektronik", platforms:JSON.stringify(["ebay","kleinanzeigen"]), views:89, days:3 },
    { title:"Levi's 501 Original Jeans W32 L32", description:"Medium Stonewash, keine Mängel.", price:35, buyPrice:18, condition:"Gut", category:"Kleidung & Accessoires", status:"verkauft", platforms:JSON.stringify(["vinted"]), views:201, days:12 },
    { title:"PlayStation 5 Disc Edition Bundle", description:"PS5 mit 2 Controllern & 3 Spielen, einwandfrei.", price:380, buyPrice:310, condition:"Gut", category:"Elektronik", platforms:JSON.stringify(["ebay","vinted","kleinanzeigen"]), views:312, days:7 },
    { title:"Adidas Ultraboost 22 Schwarz Gr. 42", description:"Selten getragen, sehr guter Zustand.", price:80, buyPrice:55, condition:"Gut", category:"Schuhe", status:"inaktiv", platforms:JSON.stringify(["kleinanzeigen"]), views:23, days:21 },
  ]
  for (const l of listings) await prisma.listing.create({ data: l })
  console.log('✅ Demo-Daten geladen!')
}

main().finally(() => prisma.$disconnect())
