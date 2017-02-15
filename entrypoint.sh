#!/bin/bash

#configure and run gulp based on our environment

case $ENVIRONMENT in
  production)
    cd ionic_rainapp
    npm run setup-prod
    npm run babel
    cd ..
    ./run_production.sh
    ;;
  test)
    echo 'not running ui, as we are in test mode'
    ;;
  development)
    cd ionic_rainapp
    npm run setup-dev
    npm run babel
    cd ..
    ./run_development.sh
    ;;
  *)
    echo "unsupported environment $ENVIRONMENT"
    echo "ENVIRONMENT must be {production|development|test}"
    exit 1
esac
