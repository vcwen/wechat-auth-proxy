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
yarn global add jest
npm test'''
      }
    }
  }
  environment {
    HOME = '.'
  }
}