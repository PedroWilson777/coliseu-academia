import { createClient } from '@supabase/supabase-js'
import { PrismaClient, UserRole } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const prisma = new PrismaClient()

const usersToSetup = [
  { email: 'pedrowicloud@gmail.com', password: 'adm000', role: UserRole.ADMIN, name: 'Pedro Admin' },
  { email: 'coliseutx@gmail.com', password: 'adm000', role: UserRole.ADMIN, name: 'Coliseu Admin' },
  { email: 'jordancoliseu@orkstra.com', password: 'coliseu2026', role: UserRole.TEACHER, name: 'Jordan Coliseu' },
]

async function main() {
  for (const userConfig of usersToSetup) {
    console.log(`\nConfigurando usuário: ${userConfig.email}...`)
    
    // 1. Criar ou atualizar no Supabase Auth
    const { data: adminData, error: listError } = await supabase.auth.admin.listUsers()
    
    let supabaseUser = adminData?.users.find(u => u.email === userConfig.email)
    
    if (supabaseUser) {
      console.log(`  Usuário já existe no Supabase. Atualizando senha...`)
      const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        supabaseUser.id,
        { password: userConfig.password, email_confirm: true }
      )
      if (updateError) {
        console.error(`  [ERRO Supabase Update] ${updateError.message}`)
        continue
      }
      console.log(`  Senha atualizada no Supabase!`)
    } else {
      console.log(`  Criando novo usuário no Supabase...`)
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: userConfig.email,
        password: userConfig.password,
        email_confirm: true,
      })
      if (createError || !data.user) {
        console.error(`  [ERRO Supabase Create] ${createError?.message}`)
        continue
      }
      supabaseUser = data.user
      console.log(`  Usuário criado no Supabase! ID: ${supabaseUser.id}`)
    }

    // 2. Sincronizar com o Prisma (User)
    let dbUser = await prisma.user.findUnique({
      where: { email: userConfig.email }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: userConfig.email,
          name: userConfig.name,
          role: userConfig.role,
          supabaseId: supabaseUser.id
        }
      })
      console.log(`  Usuário criado no banco (Prisma)!`)
    } else {
      dbUser = await prisma.user.update({
        where: { email: userConfig.email },
        data: {
          role: userConfig.role,
          supabaseId: supabaseUser.id
        }
      })
      console.log(`  Usuário atualizado no banco (Prisma)!`)
    }

    // 3. Se for professor, garantir que o registro Teacher exista
    if (userConfig.role === UserRole.TEACHER) {
      const existingTeacher = await prisma.teacher.findUnique({
        where: { userId: dbUser.id }
      })
      if (!existingTeacher) {
        await prisma.teacher.create({
          data: {
            userId: dbUser.id,
            name: userConfig.name,
            active: true
          }
        })
        console.log(`  Perfil de Professor (Teacher) criado no banco!`)
      } else {
        console.log(`  Perfil de Professor já existe.`)
      }
    }
  }

  console.log('\nFinalizado com sucesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
