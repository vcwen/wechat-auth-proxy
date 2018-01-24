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
yarn global add jest
npm test'''
      }
    }
  }
  environment {
    HOME = '.'
  }
}