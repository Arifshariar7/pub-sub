FROM mysql:8.0
COPY ./init_db.sql ./tmp
ENV MYSQL_HOST=db
ENV MYSQL_DATABASE=mydb
ENV MYSQL_USERNAME=root
ENV MYSQL_ROOT_PASSWORD=password
ENV MYSQL_PASSWORD=password
ENV MYSQL_TABLE=mytable

CMD ["mysqld","--init-file=/tmp/init_db.sql"]