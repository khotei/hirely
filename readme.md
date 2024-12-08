```shell
# Start database
sh ./deployment/scripts/run-db.sh
```

```shell
# Generate code dependencies
npm run codegen
```

```shell
# Configure development environments for a service
cp ./app/<service>/.env.example ./app/<service>/.env
```

```shell
# Start apps
npm run dev

# Server URL: http://localhost:3000/graphql
```
