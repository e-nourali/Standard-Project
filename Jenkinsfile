pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                echo "Deploying website..."
                
                TARGET_DIR=/var/jenkins_home/standard-project/

                # کپی کردن فایل‌ها
                cp -r standard-project/* $TARGET_DIR/

                # تغییر دسترسی‌ها
                # chown -R www-data:www-data $TARGET_DIR     #deleted
                
                chmod -R 755 $TARGET_DIR
                '''
            }
        }
    }
    triggers {
        githubPush()
    }
}