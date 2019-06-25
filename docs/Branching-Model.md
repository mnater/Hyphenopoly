# Branching Model

Since Version 3.0.0 a branching model based on [https://nvie.com/posts/a-successful-git-branching-model/](https://nvie.com/posts/a-successful-git-branching-model/) is used.

## Overview
````text
       tag                              tag                  tag
        v                                v                    v
master    #--------------------------------#--------------------#---  stable
           \                              /                    /
(release)   \                      #--#--#                 #--#       locally prepare merge to master
             \                    /                       /
develop   ----#--#------#--#--#--#----#-------#--#-------#----------  public dev branch
                  \    /
(feature)          #--#                                               local dev branches                                     
````

## Branches

### master
The public `master` branch always reflects the currently released actual version, i.e. a production-ready state.
Merges to `master` must always cause a new release.

### develop
The public `develop` branch reflects the state of the latest stable development state. The code here is tested but waiting for more changes to accumulate, before a new release is triggered.

### release
The `release` branch is a temporary preparation branch. It is always branched from the `develop` branch, when enough changes piled up. This is the last stage where version numbers are updated, final tests are made and changelog is finalised before it is merged to master.

`release`branches are named `release-x.y.z`. In most cases they are not pushed to GitHub.

### feature
`feature` branches are temporary branches for creating features, that can not be implemented directly in the `develop` branch. `feature` branches are branched/merged from/to `develop`.
In most cases they are not pushed to GitHub and are named depending on the feature they implement.