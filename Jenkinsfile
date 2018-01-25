pipeline {
  agent any
  tools {
        mongodb 'linux_x86_64-3.4.0' 
    }
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
        sh 'mongod --quiet --fork --noauth --pidfilepath ${WORKSPACE}/mongopid --logpath ${WORKSPACE}/data/log --dbpath ${WORKSPACE}/data/db'
      }
    }
    stage('clear') {
      steps {
        sh 'echo success'
      }
    }
  }
}
