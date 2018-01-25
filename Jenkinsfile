pipeline {
  agent none
  stages {
    stage('Node.js 8') {
      parallel {
        stage('Node.js 8') {
          agent {
            docker {
              image 'node:8'
            }
            
          }
          steps {
            sh 'yarn install'
            sh 'yarn test'
          }
        }
        stage('node.js 9') {
          agent {
            docker {
              image 'node:9'
            }
            
          }
          steps {
            sh '''yarn install
yarn test'''
          }
        }
      }
    }
    stage('mongodb') {
      steps {
        docker.image('mongodb:3.4').withRun { c ->
          sh 'yarn install'
          sh 'yarn test'
        }
      }
    }
    stage('clear') {
      steps {
        sh 'echo success'
      }
    }
  }
}
