node {
  docker.image('mongo:3.4').withRun { c ->
    pipeline {

        stage('test') {
          steps {
            sh 'echo success'
          }
      }
    }
    
  }
}
