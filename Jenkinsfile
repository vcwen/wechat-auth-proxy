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
yarn'''
      }
    }
    stage('Test') {
      steps {
        sh 'yarn test'
      }
    }
  }
  environment {
    HOME = '.'
  }
}