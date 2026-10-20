FROM eclipse-temurin:21-jre-alpine   
#Java 21 runtime
WORKDIR /app
#sets the working director
COPY target/*.jar app.jar
#copies the built JAR
EXPOSE 8761
#documents the Eureka Server port
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
#starts your Spring Boot application