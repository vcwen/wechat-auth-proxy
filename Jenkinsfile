pipeline {
  agent {
    docker {
      image 'node:8'
    }
    
  }
  stages {
    stage('install') {
      steps {
        sh '''node --version
yarn config set registry https://registry.npm.taobao.org
yarn install
yarn test'''
      }
    }
  }
  environment {
    HOME = '.'
  }
}