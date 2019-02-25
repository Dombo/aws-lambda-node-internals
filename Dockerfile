FROM amazonlinux:latest

RUN echo LC_ALL=en_GB.UTF-8 >> /etc/environment
ENV LC_ALL=en_GB.UTF-8

RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - && \
    curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo && \
    yum install -y nodejs gcc-c++ make git yarn zip unzip

ENV SERVERLESS serverless@1.38.0
RUN yarn global add $SERVERLESS

ARG UID
RUN useradd -d /home/node/ -u $UID -U -s /bin/bash node

WORKDIR /opt/app