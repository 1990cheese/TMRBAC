# Task-Manager-Role-Based-Access-Controls

Given the time constraints of the project this is what I was able to get done, hope you like it.
Scalable Nx monorepo with API/Backend written in NodeJS/NestJS + PostgresQL/TypeORM, Frontend written in Angular/SCSS.
Full RBAC + JWT auth implementation with bcrypt for password hashing.

Dashboard was supposed to be a Jira inspired task board.

# Architecture/Design

The monorepo is structured as per the spec provided for the challenge, with the only change made being moving the libs folder
into the apps/ directory as that is the highest level directory they will be accessed from.

Backend: apps/api
Frontend: apps/dashboard
Shared DTOs/Entities: apps/libs/data

## Setup and quickstart

1. Clone the repo and npm install

The application requires two terminals to run, ports/DB variables all pulled from env file.
The env file provided in the repo should work out of the box but in case it doesn't the required variables are:

DB_HOST (IP for postgres host)
DB_PORT (open port)
DB_USERNAME (login name to access postgres DB)
DB_PASSWORD (password to access postgres DB)
DB_NAME (name of db to seed and connect to)
JWT_SECRET (random long string used for JWT encryption/decription)
SUPERUSERNAME (name of "owner" roll account to seed to db)
SUPERUSERPASS (password to log into "owner" account on frontend)
SUPERUSEREMAIL (login email for "owner" account)

2. In first terminal run nx serve api

DB seeding logic lives in apps/api/src/app/main.ts (creates superuser, roles, permission/role relationship, two organizations named "parent" and "child", and a few dummy users and tasks)

2. nx serve dashboard

starts the frontend on default localhost:3000, login to superuser account to modify/test rolls + organizations, register however many users you please and simply log into the superuser account whenever you need "owner" access.
