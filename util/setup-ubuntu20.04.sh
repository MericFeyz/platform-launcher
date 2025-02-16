CURR_DIR=$(pwd)
SCRIPT_PATH=$(realpath $0)

printf "\033[1mInstalling docker\n"
printf -- "-----------------\033[0m\n"
sudo apt -qq update
sudo apt-get -qq install apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt -qq update
sudo apt-get install -y docker-ce=5:23.0.0-1~ubuntu.20.04~$(lsb_release -cs) docker-ce-cli=5:23.0.0-1~ubuntu.20.04~$(lsb_release -cs) containerd.io
printf "\033[1mSuccessfully installed %s\033[0m\n" "$(docker --version)"
printf "\n"

if [[ -z $(groups | grep docker) ]];
then
    sudo usermod -a -G docker $USER;
    echo "$USER has been added to the docker group.";
    echo "Script is being restarted for changes to take effect.";
    sudo -u $USER /bin/bash $SCRIPT_PATH;
    exit;
fi;

printf "\033[1mInstalling docker-compose\n"
printf -- "-----------------\033[0m\n"
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose
printf "\033[1mSuccessfully installed docker-compose %s\033[0m\n"
printf "\n"


printf "\033[1mInstalling k3d\n"
printf -- "-----------------\033[0m\n"
curl -s https://raw.githubusercontent.com/rancher/k3d/main/install.sh | TAG=v4.4.7 bash
printf "\033[1mSuccessfully installed %s\033[0m\n" "$(k3d --version)"
printf "\n"

printf "\033[1mInstalling k3d docker repo\n"
printf -- "-----------------------\033[0m\n"
k3d registry create iff.localhost -p 12345
echo "Adding to /etc/hosts:"
echo "" | sudo tee -a /etc/hosts
echo "127.0.0.1 k3d-iff.localhost" | sudo tee -a /etc/hosts


printf "\033[1mInstalling kubectl\n"
printf -- "------------------\033[0m\n"
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.22.0/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/bin/kubectl
if [ ! -d ~/.kube ]; then
      mkdir ~/.kube
fi
printf "\033[1mSuccessfully installed kubectl\033[0m\n"
kubectl version --short
printf "\n"

printf "\033[1mInstalling helm\n"
printf -- "---------------\033[0m\n"
cd /tmp
wget https://get.helm.sh/helm-v3.9.0-linux-amd64.tar.gz
tar xf helm-v3.9.0-linux-amd64.tar.gz
sudo cp linux-amd64/helm /usr/bin/helm
printf "\033[1mHelm installed succesfully.\033[0m\n"
cd $CURR_DIR

printf "\033[1mInstalling test dependencies\n"
printf -- "----------------------------\033[0m\n"
sudo apt -qq -y install nodejs npm make git python3-pip
sudo pip install shyaml
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh -o install_nvm.sh
bash install_nvm.sh
source ~/.profile
nvm install 10
sudo npm install -g nodemailer
sleep 3

printf "\033[1mInstalling jq\n";
printf -- "---------------\033[0m\n";
sudo apt-get -q install jq;
printf "\n";

printf "\033[1mInstalling bats\n";
printf -- "---------------\033[0m\n";
sudo apt install -yq bats
printf "\n";

printf "\033[1mInstalling S3 tools\n"
printf -- "----------------------------\033[0m\n"
sudo apt -qq install s3cmd

cd $(dirname $SCRIPT_PATH)/..
make restart-cluster
