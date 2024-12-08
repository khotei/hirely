docker run --name hirely-postgres \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=test \
    -e POSTGRES_USER=test \
    -e POSTGRES_DB=hirely \
    -d postgres