pipeline {
  agent {
    docker {
      image 'node:8'
    }
    
  }
  stages {
    stage('install') {
      steps {
        sh '''ls
npm install'''
      }
    }
  }
}