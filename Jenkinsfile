node {
  docker.image('mongo:3.4').withRun { c ->
    pipeline {
      stages {
        stage('test') {
          steps {
            sh 'echo success'
          }
          
        }
      }
    }
    
  }
}
