pipeline {
    agent none
    stages {
        stage('Node.js 8') {
            agent {
                docker { image 'node:8' }
            }
            steps {
                sh 'yarn install'
                sh 'yarn test'
            }
        }
        stage('Node.js 9') {
            agent {
                docker { image 'node:9' }
            }
            steps {
                sh 'yarn install'
                sh 'yarn test'
            }
        }
    }
}
