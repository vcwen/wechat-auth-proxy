node {
  docker.image('mongo:3.4').withRun { c ->
    pipeline {

        stage('test') {
            sh 'echo success'
      }
    }
    
  }
}
