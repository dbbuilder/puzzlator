# Docker Configuration for Puzzler

This project uses Docker to run PostgreSQL and pgAdmin with isolation from other Docker projects on your system.

## Isolation Features

1. **Unique Container Names**: All containers are prefixed with `puzzler_`
2. **Custom Network**: Uses `puzzler_network` with subnet `172.28.0.0/16`
3. **Named Volumes**: All volumes are prefixed with `puzzler_`
4. **Project Labels**: All resources are labeled with `project: "puzzler"`
5. **Environment File**: Uses `.env.docker` for configuration
6. **Custom Ports**: Uses ports in the 14000-14500 range

## Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# Clean up (removes volumes)
npm run docker:clean

# View logs
npm run docker:logs

# Check status
npm run docker:status
```

## Port Mappings

- PostgreSQL: `14322` (host) → `5432` (container)
- pgAdmin: `14323` (host) → `80` (container)

## Accessing Services

- **PostgreSQL**: `postgresql://postgres:postgres@localhost:14322/puzzler`
- **pgAdmin**: http://localhost:14323
  - Email: `admin@puzzler.local`
  - Password: `admin`

## Avoiding Conflicts

This configuration ensures no conflicts with other Docker projects by:

1. Using unique container names (`puzzler_postgres_db`, `puzzler_pgadmin`)
2. Using a dedicated network (`puzzler_network`) with a specific subnet
3. Using named volumes with project prefix
4. Using ports in the 14000-14500 range (unlikely to conflict)
5. Using `COMPOSE_PROJECT_NAME=puzzler` to namespace all resources

## Troubleshooting

If you have conflicts:

1. Check for existing containers:
   ```bash
   docker ps -a | grep puzzler
   ```

2. Check for existing networks:
   ```bash
   docker network ls | grep puzzler
   ```

3. Check for existing volumes:
   ```bash
   docker volume ls | grep puzzler
   ```

4. Clean up if needed:
   ```bash
   npm run docker:clean
   docker network rm puzzler_network
   ```